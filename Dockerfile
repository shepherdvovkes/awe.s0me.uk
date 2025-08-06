FROM ubuntu:20.04

# Установка необходимых пакетов
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update && apt-get install -y \
    dosbox \
    nasm \
    gcc \
    gdb \
    make \
    wine \
    qemu-system-x86 \
    wget \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Создание рабочей директории
WORKDIR /workspace

# Установка Free Pascal Compiler (современная замена Turbo Pascal)
RUN wget https://sourceforge.net/projects/freepascal/files/Linux/3.2.2/fpc-3.2.2.x86_64-linux.tar/download -O fpc.tar \
    && tar -xf fpc.tar \
    && cd fpc-3.2.2.x86_64-linux \
    && echo "y" | ./install.sh --silent \
    && cd .. \
    && rm -rf fpc-3.2.2.x86_64-linux fpc.tar

# Установка Turbo Assembler через Wine (если есть)
RUN mkdir -p /opt/turbo \
    && echo "Turbo Assembler will be mounted here" > /opt/turbo/README.txt

# Создание конфигурации DOSBox
RUN mkdir -p /root/.dosbox
COPY docker/dosbox.conf /root/.dosbox/dosbox-0.74-3.conf

# Копирование скриптов
COPY docker/scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh

# Создание директорий для разных эмуляторов
RUN mkdir -p /workspace/asm \
    && mkdir -p /workspace/pascal \
    && mkdir -p /workspace/dos \
    && mkdir -p /workspace/output

# Установка переменных окружения
ENV PATH="/usr/local/bin:${PATH}"
ENV FPC_DIR="/usr/local/lib/fpc/3.2.2"
ENV DOSBOX_CONF="/root/.dosbox/dosbox-0.74-3.conf"

# Открытие порта для веб-интерфейса (если понадобится)
EXPOSE 8080

# Команда по умолчанию
CMD ["/bin/bash"] 