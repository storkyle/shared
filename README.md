# @storkyle/shared

A shared TypeScript library providing base entities, services, utilities, and common functionality for Node.js applications using TypeORM and GraphQL.

## Installation

```bash
npm install @storkyle/shared
# or
yarn add @storkyle/shared
```

## Requirements

- Node.js >= 18.12.1
- TypeScript >= 5.3.3

## Features

### Base Classes

- **BaseEntity**: TypeORM base entity with common fields (id, status, timestamps, audit fields)
- **BaseEntityWithoutId**: Base entity without primary key
- **BaseRepository**: Base repository with common database operations
- **BaseService**: Base service class for business logic
- **ExternalService**: Base class for external service integrations

### Enums

- **Common Enums**: Shared enumeration types
- **Environment Enums**: Environment-specific enumerations
- **Status Enums**: Record status enumerations (e.g., ACTIVE, INACTIVE)

### Interfaces

- **IContextGraphql**: GraphQL context interface with request/response and user context
- **IActor**: Actor interface for user/entity identification
- **IFilter**: Filter interface for query operations

### Utilities

- **Date Formatting**: Format dates using dayjs
- **URL Formatting**: URL manipulation utilities
- **Boolean Casting**: Type-safe boolean conversion
- **GraphQL Error Generation**: Generate standardized GraphQL errors
- **Request Headers**: Extract and parse request headers
- **Data Trimming**: Trim object properties recursively

### Constants

- **Common Constants**: Shared constant values
- **Filter Constants**: Filter-related constants
- **GraphQL Error Codes**: Standardized GraphQL error codes

### Libraries

- **Combine Resolver**: Utility for combining GraphQL resolvers

## Usage

### Base Entity

```typescript
import { BaseEntity } from '@storkyle/shared';
import { Entity } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  // Your custom fields here
  // Inherits: id, status, removed, creator, updater, remover, timestamps
}
```

### GraphQL Context

```typescript
import { IContextGraphql } from '@storkyle/shared';

const resolvers = {
  Query: {
    getUser: (parent, args, context: IContextGraphql) => {
      const userId = context.uid;
      // Your logic here
    },
  },
};
```

### Utilities

```typescript
import { formatDate, castBoolean, trimData } from '@storkyle/shared';

const formatted = formatDate(new Date(), 'YYYY-MM-DD');
const boolValue = castBoolean('true');
const cleaned = trimData({ name: '  John  ', age: 25 });
```

## Development

### Build

```bash
yarn build
```

### Publish

```bash
yarn pub
```

## License

MIT

## Repository

- **GitHub**: [https://github.com/storkyle/shared](https://github.com/storkyle/shared)
- **Issues**: [https://github.com/storkyle/shared/issues](https://github.com/storkyle/shared/issues)

## Author

Storky Le <storkyle.com@gmail.com>
