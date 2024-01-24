from node:20 as builder

WORKDIR /app

COPY ./ ./

RUN npm install

RUN npm run build

FROM node:20 as target

WORKDIR /app

COPY --from=builder /app/dist ./

COPY --from=builder /app/package* ./

RUN npm install

ENV NODE_ENV=production

CMD ["node", "/app"]