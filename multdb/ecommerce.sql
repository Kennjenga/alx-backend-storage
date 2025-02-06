-- Create database if not exists
CREATE DATABASE
IF NOT EXISTS ecommerce;
USE ecommerce;

-- Products table
CREATE TABLE products
(
    id VARCHAR(24) PRIMARY KEY,
    -- MongoDB ID format
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_name (name),
    INDEX idx_product_category (category)
    );

    -- Orders table
    CREATE TABLE orders (
    id VARCHAR(24) PRIMARY KEY,  -- MongoDB ID format
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    shipping_address_street VARCHAR
    (255),
    shipping_address_city VARCHAR
    (100),
    shipping_address_state VARCHAR
    (100),
    shipping_address_zip VARCHAR
    (20),
    shipping_address_country VARCHAR
    (100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON
    UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_status (status),
    INDEX idx_order_created (created_at)
    );

    -- Order items table (for order-product relationship)
    CREATE TABLE order_items
    (
        id INT
        AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR
        (24) NOT NULL,
    product_id VARCHAR
        (24) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL
        (10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
        (order_id) REFERENCES orders
        (id) ON
        DELETE CASCADE,
    FOREIGN KEY (product_id)
        REFERENCES products
        (id),
    INDEX idx_order_items_order
        (order_id),
    INDEX idx_order_items_product
        (product_id)
);

-- Trigger to reduce product stock when order item is inserted
DELIMITER //
        CREATE TRIGGER after_order_item_insert
AFTER
        INSERT ON
        order_items
        FOR
        EACH
        ROW
        BEGIN
            UPDATE products
    SET stock = stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
        END
        //

        -- Trigger to restore product stock when order is cancelled
        CREATE TRIGGER after_order_cancel
AFTER
        UPDATE ON orders
FOR EACH ROW
        BEGIN
            IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            UPDATE products p
        INNER JOIN order_items oi
            ON p.id = oi.product_id
            SET p
            .stock = p.stock + oi.quantity,
            p.updated_at = CURRENT_TIMESTAMP
        WHERE oi.order_id = NEW.id;
        END
        IF;
END//

        -- Trigger to validate stock before order item insertion
        CREATE TRIGGER before_order_item_insert
BEFORE
        INSERT ON
        order_items
        FOR
        EACH
        ROW
        BEGIN
            DECLARE available_stock INT;

        SELECT stock
        INTO available_stock
        FROM products
        WHERE id = NEW.product_id;

        IF available_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT
        = 'Insufficient stock available';
        END
        IF;
END//

DELIMITER ;

        -- Create a view for order summaries
        CREATE VIEW order_summaries
        AS
            SELECT
                o.id,
                o.status,
                o.total_amount,
                o.created_at,
                COUNT(oi.id) as total_items,
                GROUP_CONCAT(p.name SEPARATOR ', '
        ) as products
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id;

        -- Indexes for performance optimization
        CREATE INDEX idx_product_price ON products(price);
        CREATE INDEX idx_order_date_status ON orders(created_at, status);

        -- Sample insert statements for testing
        INSERT INTO products
            (id, name, description, price, stock, category)
        VALUES
            ('507f1f77bcf86cd799439011', 'Test Product 1', 'Description 1', 29.99, 100, 'Electronics'),
            ('507f1f77bcf86cd799439012', 'Test Product 2', 'Description 2', 39.99, 50, 'Books');

        INSERT INTO orders
            (id, total_amount, status)
        VALUES
            ('507f1f77bcf86cd799439013', 29.99, 'pending');

        INSERT INTO order_items
            (order_id, product_id, quantity, price)
        VALUES
            ('507f1f77bcf86cd799439013', '507f1f77bcf86cd799439011', 1, 29.99);