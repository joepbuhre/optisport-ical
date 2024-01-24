from node:20 as builder

WORKDIR /app

COPY ./ ./

RUN npm install

RUN npm run build

FROM node:20 as target

WORKDIR /app

COPY --from=builder /app/dist ./

COPY --from=builder /app/package* ./

RUN apt update && \ 
    apt install ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

RUN npm install

ENV NODE_ENV=production

CMD ["node", "/app"]