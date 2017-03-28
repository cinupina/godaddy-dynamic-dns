FROM mhart/alpine-node:7.7.4

ENV INTERVAL 3600

WORKDIR /opt/godaddy-dynamic-dns

COPY godaddy-dynamic-dns-daemon.sh auth.json config.json package.json ./
RUN mkdir src
COPY src/index.js ./src

RUN npm install

CMD ["./godaddy-dynamic-dns-daemon.sh"]
