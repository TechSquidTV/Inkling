package logs

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

// DockerLogService implements Service using Docker Socket
type DockerLogService struct {
	client *client.Client
}

// NewDockerLogService creates a new Docker log service
func NewDockerLogService() (*DockerLogService, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}

	return &DockerLogService{client: cli}, nil
}

// StreamLogs returns a channel of log lines from Docker containers
func (d *DockerLogService) StreamLogs(ctx context.Context, service string, tail int) (<-chan string, error) {
	ch := make(chan string, 100)

	// List containers and find matching service
	containers, err := d.client.ContainerList(ctx, container.ListOptions{})
	if err != nil {
		close(ch)
		return ch, fmt.Errorf("failed to list containers: %w", err)
	}

	var containerID string
	for _, c := range containers {
		// Match by container name or compose service name
		for _, name := range c.Names {
			// Docker container names start with "/"
			cleanName := strings.TrimPrefix(name, "/")
			if strings.Contains(cleanName, service) {
				containerID = c.ID
				break
			}
		}
		if containerID != "" {
			break
		}
	}

	if containerID == "" {
		close(ch)
		ch <- fmt.Sprintf("No container found for service: %s", service)
		return ch, nil
	}

	// Start streaming logs in a goroutine
	go func() {
		defer close(ch)

		tailStr := fmt.Sprintf("%d", tail)
		if tail == 0 {
			tailStr = "0"
		}

		options := container.LogsOptions{
			ShowStdout: true,
			ShowStderr: true,
			Follow:     true,
			Tail:       tailStr,
		}

		reader, err := d.client.ContainerLogs(ctx, containerID, options)
		if err != nil {
			ch <- fmt.Sprintf("Error reading logs: %v", err)
			return
		}
		defer reader.Close()

		// Docker logs use a multiplexed stream format with 8-byte headers
		// We need to parse this format
		scanner := bufio.NewScanner(reader)
		for scanner.Scan() {
			line := scanner.Text()

			// Docker prepends 8 bytes (header) to each line
			// Strip ANSI-like stream headers if present
			if len(line) > 8 {
				// Check if first byte is a stream type (0, 1, or 2)
				if line[0] <= 2 {
					line = line[8:]
				}
			}

			select {
			case ch <- line:
			case <-ctx.Done():
				return
			}
		}

		if err := scanner.Err(); err != nil && err != io.EOF {
			select {
			case ch <- fmt.Sprintf("Scanner error: %v", err):
			case <-ctx.Done():
			}
		}
	}()

	return ch, nil
}

// Close closes the Docker client connection
func (d *DockerLogService) Close() error {
	if d.client != nil {
		return d.client.Close()
	}
	return nil
}

var _ Service = (*DockerLogService)(nil)
