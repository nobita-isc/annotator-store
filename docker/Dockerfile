FROM ubuntu:latest

# Prevent race condition of apt repository
RUN sudo sed -i -e"s/archive/uk.archive/" /etc/apt/sources.list

# Install update and neccessary software
RUN apt-get update && \
    apt-get install -y git vim python python-pip

# Install virtualenv
RUN pip install virtualenv

ADD ./startup.sh /opt/startup.sh
RUN chmod +x /opt/startup.sh

EXPOSE 80

ENTRYPOINT ["/bin/bash", "/opt/startup.sh"]

