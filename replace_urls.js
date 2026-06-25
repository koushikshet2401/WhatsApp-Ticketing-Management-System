const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('frontend/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:8080')) {
    content = content.replace(/'http:\/\/localhost:8080([^']*)'/g, '`${import.meta.env.VITE_API_BASE_URL || \'http://localhost:5000\'}$1`');
    content = content.replace(/http:\/\/localhost:8080/g, '${import.meta.env.VITE_API_BASE_URL || \'http://localhost:5000\'}');
    
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
