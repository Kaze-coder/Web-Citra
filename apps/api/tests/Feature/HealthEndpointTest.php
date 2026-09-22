<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_health_returns_expected_envelope(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['status', 'timestamp'],
                'message',
                'meta' => ['version', 'request_id'],
            ])
            ->assertJsonPath('data.status', 'healthy')
            ->assertJsonPath('message', 'Service is running.');
    }

    public function test_health_returns_request_id_header(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $this->assertNotEmpty($response->headers->get('X-Request-ID'));
    }

    public function test_health_echoes_provided_request_id(): void
    {
        $id = '52fdfc07-2182-42b1-9e4f-c36f4993dd54';

        $response = $this->getJson('/api/v1/health', ['X-Request-ID' => $id]);

        $response
            ->assertOk()
            ->assertHeader('X-Request-ID', $id)
            ->assertJsonPath('meta.request_id', $id);
    }

    public function test_health_replaces_invalid_request_id(): void
    {
        $response = $this->getJson('/api/v1/health', [
            'X-Request-ID' => "invalid\r\nheader",
        ]);

        $requestId = $response->headers->get('X-Request-ID');

        $response->assertOk();
        $this->assertNotSame("invalid\r\nheader", $requestId);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $requestId
        );
    }

    public function test_health_generates_uuid_when_no_request_id_sent(): void
    {
        $response = $this->getJson('/api/v1/health');

        $requestId = $response->headers->get('X-Request-ID');

        // UUID v4 format
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $requestId
        );
    }
}
