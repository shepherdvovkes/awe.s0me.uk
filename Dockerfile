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
    openssh-server \
    openssh-client \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Настройка SSH
RUN mkdir /var/run/sshd
RUN echo 'root:retro123' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

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

# Открытие портов для SSH и веб-интерфейса
EXPOSE 22 8080

# Скрипт запуска SSH и других сервисов
COPY docker/start-services.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start-services.sh

# Команда по умолчанию
CMD ["/usr/local/bin/start-services.sh"] 