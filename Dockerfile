FROM node:12
WORKDIR /usr/src/app
COPY package.json .
RUN bash -c 'https_proxy=http://10.227.9.241:8888/ http_proxy=http://10.227.9.241:8888/ npm install'
COPY app.js .
EXPOSE 8080
CMD ["npm","run","start"]