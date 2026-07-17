# Process

Here is where I document my process as I work through the assignment.

## Plan
I like to work with incremental development, each delivery should be a small, testable piece of functionality.

- Create two endpoints - one receives SMS messages, other list the conversations. I'll not persist anything yet, so the webhook will just ack the response and the conversations will return a mock list.
- Implement persistance using TypeORM and Postgres. I chose TypeORM because it works swiftly with NestJS, and Postgres because it focus on consistency even when partitioned (PACELC), the latency will scale okay for this use case. As for availability, Twillio have a good retry policy, so momentary unavailability is tolerable.
- Mock twillio at first, but implement it later, so I can easily setup and create testing scenarios