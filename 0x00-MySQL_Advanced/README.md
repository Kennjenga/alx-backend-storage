# MySQL Database Concepts

## Creating Tables with Constraints

Constraints are rules enforced on data columns to ensure data integrity. Common constraints include `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, and `CHECK`.

### Example:

```sql
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL,
    Age INT CHECK (Age >= 18)
);
```

## Optimizing Queries by Adding Indexes

Indexes improve the speed of data retrieval operations on a database table. They can be created on one or more columns.

### Example:

```sql
CREATE INDEX idx_username ON Users (Username);
```

## Stored Procedures and Functions

Stored procedures and functions are sets of SQL statements that can be stored in the database and executed repeatedly.

### Stored Procedure Example:

```sql
DELIMITER //
CREATE PROCEDURE GetUserByID(IN userID INT)
BEGIN
    SELECT * FROM Users WHERE UserID = userID;
END //
DELIMITER ;
```

### Function Example:

```sql
DELIMITER //
CREATE FUNCTION GetUserAge(userID INT) RETURNS INT
BEGIN
    DECLARE userAge INT;
    SELECT Age INTO userAge FROM Users WHERE UserID = userID;
    RETURN userAge;
END //
DELIMITER ;
```

## Implementing Views in MySQL

A view is a virtual table based on the result-set of an SQL statement. It can simplify complex queries and enhance security.

### Example:

```sql
CREATE VIEW UserEmails AS
SELECT Username, Email FROM Users;
```

## Implementing Triggers in MySQL

Triggers are SQL statements that are automatically executed in response to certain events on a particular table.

### Example:

```sql
DELIMITER //
CREATE TRIGGER BeforeInsertUser
BEFORE INSERT ON Users
FOR EACH ROW
BEGIN
    SET NEW.Username = LOWER(NEW.Username);
END //
DELIMITER ;
```
