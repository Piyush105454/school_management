import * as fs from "fs";
import * as path from "path";

function walk(dir: string, files: string[] = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walk(fullPath, files);
      }
    } else {
      if (file.toLowerCase().includes("middleware")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const found = walk(path.join(__dirname, ".."));
console.log("Found middleware files:", found);
