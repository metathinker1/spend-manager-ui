import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

export function NotFound() {
  return (
    <Stack gap="xs">
      <Title order={2}>Page not found</Title>
      <Text>
        <Anchor component={Link} to="/transactions">
          Go to Transactions
        </Anchor>
      </Text>
    </Stack>
  );
}
