#!/bin/bash

case "$1" in
    "start")
        echo "🚀 Starting Retro Terminal in Docker..."
        docker-compose -f docker-compose.web.yml up -d
        echo "✅ Container started!"
        echo "🌐 Access at: http://localhost:3000"
        ;;
    "stop")
        echo "🛑 Stopping Retro Terminal..."
        docker-compose -f docker-compose.web.yml down
        echo "✅ Container stopped!"
        ;;
    "restart")
        echo "🔄 Restarting Retro Terminal..."
        docker-compose -f docker-compose.web.yml down
        docker-compose -f docker-compose.web.yml up -d
        echo "✅ Container restarted!"
        echo "🌐 Access at: http://localhost:3000"
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose -f docker-compose.web.yml logs -f retro-terminal
        ;;
    "status")
        echo "📊 Container status:"
        docker-compose -f docker-compose.web.yml ps
        ;;
    "build")
        echo "🔨 Building Docker image..."
        docker-compose -f docker-compose.web.yml build --no-cache
        echo "✅ Build completed!"
        ;;
    "shell")
        echo "🐚 Opening shell in container..."
        docker-compose -f docker-compose.web.yml exec retro-terminal sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|build|shell}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the container"
        echo "  stop    - Stop the container"
        echo "  restart - Restart the container"
        echo "  logs    - Show container logs"
        echo "  status  - Show container status"
        echo "  build   - Rebuild the image"
        echo "  shell   - Open shell in container"
        echo ""
        echo "🌐 Web interface: http://localhost:3000"
        ;;
esac 