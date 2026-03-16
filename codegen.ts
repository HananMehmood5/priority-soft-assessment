import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'apps/api/src/schema.gql',
  documents: ['apps/web/lib/apollo/operations.ts'],
  generates: {
    'apps/web/src/generated/graphql-types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        avoidOptionals: true,
        maybeValue: 'T | null',
        scalars: {
          DateTime: 'string',
          Date: 'string',
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;

