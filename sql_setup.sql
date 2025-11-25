USE langbuddy;

-- Users
CREATE TABLE users1 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  language VARCHAR(10) NOT NULL,
  xp INT DEFAULT 0,
  gems INT DEFAULT 100,
  hearts INT DEFAULT 5,
  streak INT DEFAULT 0,
  last_day DATE,
  unit INT DEFAULT 0,
  lesson INT DEFAULT 0
);

-- Notebook
CREATE TABLE notebook1 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  en_text TEXT,
  tr_text TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mistakes
CREATE TABLE mistakes1 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  en_text TEXT,
  tr_text TEXT,
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leaderboard
CREATE TABLE leaderboard1 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  xp INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users1
ADD COLUMN password VARCHAR(255) NOT NULL AFTER username;
ALTER TABLE users1  ADD COLUMN password VARCHAR(255);

USE langbuddy;
DROP TABLE IF EXISTS users1;
DROP TABLE IF EXISTS leaderboard1;

ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL AFTER username;

ALTER TABLE users 
ADD COLUMN xp INT DEFAULT 0;

ALTER TABLE users 
ADD COLUMN hearts INT DEFAULT 5;

ALTER TABLE users 
ADD COLUMN streak INT DEFAULT 0;

ALTER TABLE users 
ADD COLUMN unit INT DEFAULT 0;

ALTER TABLE users 
ADD COLUMN lesson INT DEFAULT 0;

ALTER TABLE users 
ADD COLUMN last_day DATE DEFAULT CURDATE();
describe users;
describe leaderboard;
use langbuddy;
describe users;













