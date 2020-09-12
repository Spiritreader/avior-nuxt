FROM node:current-buster-slim

RUN mkdir -p /app
WORKDIR /app

# Update aptitude with new repo
RUN apt update && apt upgrade
RUN apt install git

# Install software 
COPY . /app

RUN npm install
RUN npm run build
EXPOSE 10009
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=10009
CMD [ "npm", "start" ]