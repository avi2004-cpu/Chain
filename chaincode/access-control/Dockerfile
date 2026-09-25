FROM golang:1.21.13 AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /chaincode-server .

FROM alpine:3.19
ARG CC_SERVER_PORT=9999
EXPOSE ${CC_SERVER_PORT}
COPY --from=builder /chaincode-server /chaincode-server
ENTRYPOINT ["/chaincode-server"]