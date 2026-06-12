FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat curl unzip git

# Download and install Nuclei
RUN curl -L -o nuclei.zip "https://github.com/projectdiscovery/nuclei/releases/download/v3.9.0/nuclei_3.9.0_linux_amd64.zip" \
    && unzip nuclei.zip \
    && mv nuclei /usr/local/bin/ \
    && rm nuclei.zip

WORKDIR /app

# Copy the application code
COPY . .

# Make start.sh executable
RUN chmod +x start.sh

# Install dependencies and build
RUN npm ci
RUN npm run build

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV IS_DOCKER "true"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory so the nextjs user can run git pull and npm install
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 9966
ENV PORT 9966
ENV HOSTNAME "0.0.0.0"

CMD ["./start.sh"]
