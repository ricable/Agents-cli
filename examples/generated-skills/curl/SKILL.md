---
name: curl
version: 0.0.0
description: "A command line tool and library for transferring data with URL syntax, supporting DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTMP, RTMPS, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS and WSS. libcurl offers a myriad of powerful features. Use this skill when working with curl-related tasks."
ingredients:
  - curl/curl
tags:
  - c
  - client
  - curl
  - ftp
  - gopher
  - hacktoberfest
  - http
  - https
  - imaps
  - ldap
  - libcurl
  - library
  - mqtt
  - pop3
  - scp
  - sftp
  - transfer-data
  - transferring-data
  - user-agent
  - websocket
  - cli
# homepage: https://curl.se/
# license: NOASSERTION
---

# curl

A command line tool and library for transferring data with URL syntax, supporting DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTMP, RTMPS, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS and WSS. libcurl offers a myriad of powerful features

**Source**: https://curl.se/

## Usage

```bash
# Show help
curl --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run curl -- --help --json

# Introspect command schema
agents-cli schema curl --json

# Dry-run before executing
agents-cli run curl -- <args> --dry-run
```
