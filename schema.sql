DROP TABLE IF EXISTS Customers;

CREATE TABLE Customers (
  CustomerID TEXT PRIMARY KEY,
  CompanyName TEXT NOT NULL,
  ContactName TEXT NOT NULL
);

INSERT INTO Customers (CustomerID, CompanyName, ContactName)
VALUES
  ('BSBEV', 'Bs Beverages', 'Victoria Ashworth'),
  ('AROUT', 'Around the Horn', 'Thomas Hardy');
