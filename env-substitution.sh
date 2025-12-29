#!/bin/sh

# Environment variable substitution for API key injection
# This script runs on container startup to inject the Gemini API key

# Check if GEMINI_API_KEY is provided
if [ -n "$GEMINI_API_KEY" ]; then
    echo "Injecting Gemini API key into the application..."
    
    # Create a JS file that sets the API key as a global variable
    # This will be loaded before the main application
    cat > /usr/share/nginx/html/env-config.js << EOF
window.APP_CONFIG = {
    GEMINI_API_KEY: '$GEMINI_API_KEY'
};
EOF

    # Update index.html to include the env-config.js before other scripts
    sed -i '/<\/head>/i <script src="/env-config.js"></script>' /usr/share/nginx/html/index.html
    
    echo "Gemini API key injected successfully."
else
    echo "Warning: GEMINI_API_KEY environment variable not set."
    echo "The application will run but AI functionality will be disabled."
    
    # Create empty config file
    cat > /usr/share/nginx/html/env-config.js << EOF
window.APP_CONFIG = {
    GEMINI_API_KEY: null
};
EOF

    # Update index.html to include the env-config.js before other scripts
    sed -i '/<\/head>/i <script src="/env-config.js"></script>' /usr/share/nginx/html/index.html
fi

# Set proper permissions
chmod 644 /usr/share/nginx/html/env-config.js

echo "Environment configuration completed."