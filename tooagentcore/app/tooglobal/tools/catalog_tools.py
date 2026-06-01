from strands import tool

from data.catalog import PRODUCTS, RETURN_POLICIES


@tool
def get_return_policy(product_category: str) -> str:
    """Get return policy information for a specific product category.

    Args:
        product_category: Product category (e.g., 'electronics', 'accessories', 'audio')

    Returns:
        Formatted return policy details including timeframes and conditions
    """
    category = product_category.lower()
    if category in RETURN_POLICIES:
        policy = RETURN_POLICIES[category]
        return (
            f"Return policy for {category}: Window: {policy['window']}, "
            f"Condition: {policy['condition']}, Refund: {policy['refund']}"
        )
    return f"No specific return policy found for '{product_category}'. Please contact support."


@tool
def get_product_info(query: str) -> str:
    """Search for product information by name, ID, or keyword.

    Args:
        query: Product name, ID (e.g., 'PROD-001'), or search keyword

    Returns:
        Product details including name, price, category, and description
    """
    query_lower = query.lower()
    product_id = query.upper()

    if product_id in PRODUCTS:
        product = PRODUCTS[product_id]
        return (
            f"{product['name']} ({product_id}): ${product['price']}, "
            f"Category: {product['category']}, {product['description']}, "
            f"Warranty: {product['warranty_months']} months"
        )

    results = [
        f"{product_id}: {product['name']} - ${product['price']} - {product['description']}"
        for product_id, product in PRODUCTS.items()
        if query_lower in product["name"].lower()
        or query_lower in product["description"].lower()
        or query_lower in product["category"].lower()
    ]

    if results:
        return "Found products:\n" + "\n".join(results)
    return f"No products found matching '{query}'."
