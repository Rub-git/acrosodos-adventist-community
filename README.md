# Acrosodos Adventist Community

Monorepo with the backend API and the mobile client for the Acrosodos Adventist Community app.

## Structure

- `nodejs_space/`: NestJS backend API, Prisma schema, auth, moderation, posts, comments, reactions, and admin endpoints.
- `react_native_space/`: Expo / React Native client application.
- `swagger.json`: exported API schema.

## Local setup

### Backend

```bash
cd nodejs_space
yarn install
yarn start:dev
```

### Mobile app

```bash
cd react_native_space
yarn install
yarn start
```

## Notes

- Environment variables are intentionally excluded from Git.
- Generated folders such as `dist`, `.expo`, `node_modules`, and uploaded media are ignored.