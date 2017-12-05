FROM node:6-onbuild
# replace this with your application's default port

COPY src /magic-chest/src
COPY routes /magic-chest/routes
COPY views /magic-chest/views
COPY server.js /magic-chest/
COPY valid-sizes.json /magic-chest/
COPY models.js /magic-chest/
COPY package.json /magic-chest/
COPY webpack.config.js /magic-chest/
COPY webpack.prod.config.js /magic-chest/
COPY winston.js /magic-chest/

RUN cd /magic-chest && \
    npm install && \
    npm run build

EXPOSE 8080

CMD ["node","/magic-chest/server.js"]
