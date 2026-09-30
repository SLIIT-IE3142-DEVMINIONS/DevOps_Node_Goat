FROM node:18-alpine
ENV WORKDIR /usr/src/app/
WORKDIR $WORKDIR
COPY package*.json $WORKDIR
RUN npm install --production --no-cache
RUN apk add --no-cache openssl \
 && mkdir -p /usr/src/app/artifacts/cert \
 && openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" \
      -keyout /usr/src/app/artifacts/cert/server.key \
      -out /usr/src/app/artifacts/cert/server.crt


FROM node:18-alpine
ENV USER node
ENV WORKDIR /home/$USER/app
WORKDIR $WORKDIR
COPY --from=0 /usr/src/app/node_modules node_modules
RUN chown $USER:$USER $WORKDIR
COPY --chown=node . $WORKDIR
COPY --from=0 --chown=node /usr/src/app/artifacts/cert artifacts/cert
# In production environment uncomment the next line
#RUN chown -R $USER:$USER /home/$USER && chmod -R g-s,o-rx /home/$USER && chmod -R o-wrx $WORKDIR
# Then all further actions including running the containers should be done under non-root user.
USER $USER
EXPOSE 4000
