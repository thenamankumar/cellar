DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

id=1 address="127.0.0.1:5001" followers="127.0.0.1:5002 127.0.0.1:5003 127.0.0.1:5004 127.0.0.1:5005" pm2 start node "${DIR}/run.js" --name "cellar-node-1" --no-autorestart
id=2 address="127.0.0.1:5002" followers="127.0.0.1:5001 127.0.0.1:5003 127.0.0.1:5004 127.0.0.1:5005" pm2 start node "${DIR}/run.js" --name "cellar-node-2" --no-autorestart
id=3 address="127.0.0.1:5003" followers="127.0.0.1:5001 127.0.0.1:5002 127.0.0.1:5004 127.0.0.1:5005" pm2 start node "${DIR}/run.js" --name "cellar-node-3" --no-autorestart
id=4 address="127.0.0.1:5004" followers="127.0.0.1:5001 127.0.0.1:5002 127.0.0.1:5003 127.0.0.1:5005" pm2 start node "${DIR}/run.js" --name "cellar-node-4" --no-autorestart
id=5 address="127.0.0.1:5005" followers="127.0.0.1:5001 127.0.0.1:5002 127.0.0.1:5003 127.0.0.1:5004" pm2 start node "${DIR}/run.js" --name "cellar-node-5" --no-autorestart
