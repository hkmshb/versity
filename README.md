<!-- PROJECT SHIELDS -->
[![Build Status][build-shield]]()
[![Language][language-shield]](language-url)

# versity

A platform for Nigerian tertiary institution students for accessing information, campus service and various other resources such as course schedules, past question papers etc to aid their studies and campus activities.

## Built With

Versity is built on the following technologies:
- [NodeJS](https://node)
- [TypeScript](language-url)
- [ReactJS](https://reactjs.org)
- [Express](https://expressjs.org)

## Getting Started

To get a local copy of **Versity** up and running locally, follow the steps below:

### Prerequisites

- NodeJS
- Yarn
- Make

### Installation

1. Add `127.0.0.1   versity.local api.versity.local` to your **hosts** file found at `/etc/hosts` on Linux systems.
2. Clone the repository

    ```sh
    git clone git@github.com:hkmshb/versity.git
    ```

3. Install node package and run the setup

    ```sh
    cd versity
    make install

    # to server the web ui run:
    make client

    # to server the api, on a different terminal run:
    make server
    ```

<!-- MARKDOWN LINKS & IMAGES -->
[build-shield]: https://img.shields.io/badge/build-passing-success.svg?style=flat-square
[language-shield]: https://img.shields.io/badge/language-typescript-teal.svg
[language-url]: https://www.typescriptlang.org/
