from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import groq
import requests
import sqlite3
import re

app = Flask(__name__)
CORS(app)


embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

DB_PATH = "products.db"
API_KEY = "your_key"
ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

def load_data(file_path="farm2bag_web_14.txt"):
    """Loads scraped data from file."""
    with open(file_path, "r", encoding="utf-8") as file:
        data = file.readlines()
    return [line.strip() for line in data if line.strip()]

data = load_data()

# Generate & Normalize embeddings
def compute_embeddings(texts):
    embeddings = np.array([embedding_model.encode(text) for text in texts], dtype=np.float32)
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / norms 

embeddings = compute_embeddings(data)


index = faiss.IndexFlatIP(embeddings.shape[1])  
index.add(embeddings)

# Store mappings for lookup
id_to_text = {i: data[i] for i in range(len(data))}

# Initialize Groq client
client = groq.Client(api_key="your_key")  # Replace with actual key

def detect_intent(text):
    """Detects if the input is a greeting or a general query."""
    greetings = ["hi", "hello", "hey", "greetings", "what's up", "good morning", "காலை வணக்கம்!", "எப்படி இருக்கிறீர்கள்?", "நன்றி","how are you","how ar u","hw ar u","வணக்கம்!"]
    sort_fil=["sort","filter","high","low","expensive","cheap","show","only","list"]

    return "greeting" if any(greet in text for greet in greetings) else "sort_Fiter" if any(greet in text for greet in sort_fil) else "query"

def retrieve_relevant_text(query, top_k=30):
    """Retrieve top_k most relevant text from FAISS index."""
    query_embedding = embedding_model.encode(query)
    query_embedding = query_embedding / np.linalg.norm(query_embedding)  # Normalize query
    query_embedding = query_embedding.reshape(1, -1).astype(np.float32)

    distances, indices = index.search(query_embedding, top_k)  

    retrieved_texts = [id_to_text.get(idx, "") for idx in indices[0] if idx >= 0]
    
    return "\n".join(retrieved_texts) if retrieved_texts else "No relevant information found."


def generate_response(context, query):
    """Uses Groq API to generate chatbot response."""
    print("searching")
    search_prompt=[
    {"role": "system", "content": """ You are an assistant for Farm2Bag, an organic grocery platform that connects farmers directly with consumers.
    Your job is to provide clear and accurate responses based strictly on the provided context.
    Response Rules:
    1. If the user's query is about product availability, where to buy, or whether a product is on the website, ONLY return the product link without any additional text.
    2. If the user asks for price, product details, benefits, uses, or any other non-availability-related information, respond with relevant details but DO NOT include a product link.
    3. If the query is unrelated to Farm2Bag, politely inform the user that you only provide information about Farm2Bag.
    4. Keep the responses professional, concise, and relevant to the user's query.
    5. If the user's query is in a language other than English, respond in the same language.
    
    🚨 **STRICT RULES** 🚨  
    1. **Language Consistency**: Reply in the **same language** as the user's input.  
        - Tamil → Respond **fully in Tamil script (தமிழில்)**, NOT Tanglish.  
        - Hindi → Respond **fully in Devanagari (हिन्दी में)**.  
        - Telugu → Respond **fully in Telugu script (తెలుగులో)**.  
        - English → Respond in **short, friendly English**.  
    

    Examples to guide response generation:
    - Query: "Where can I buy organic apples?"  
      Response: "You can purchase organic apples on our website here: [product link]."
    - Query: "Tell me about organic apples."  
      Response: "Organic apples are free from pesticides and rich in nutrients. They are great for health."
    - Query: "What are the health benefits of organic rice?"  
      Response: "Organic rice is chemical-free and retains more nutrients compared to conventional rice."
    - Query: "How do I store organic vegetables?"  
      Response: "To store organic vegetables, keep them in a cool and dry place or refrigerate as needed."

    Now, generate the response based on the above guidelines.
    """},

    {"role": "user", "content": f"""Context: {context}  
    User Query: {query}
     """}]
    response = client.chat.completions.create(  
        model="mixtral-8x7b-32768",
        messages=search_prompt
    ) 

    return response.choices[0].message.content.strip()

def generate_greeting_response(user_input):
    print("greeting")
    """Handles greeting responses using the Groq model."""
    greet_prompt = [
    {"role": "system", "content": """You are an assistant for Farm2Bag, an organic grocery platform that connects farmers directly with consumers.
    Your job is to provide clear and accurate responses based strictly on the provided context.

    🚨 **STRICT RULES** 🚨  
    1. **Language Consistency**: Reply in the **same language** as the user's input.  
        - Tamil → Respond **fully in Tamil script (தமிழில்)**, NOT Tanglish.  
        - Hindi → Respond **fully in Devanagari (हिन्दी में)**.  
        - Telugu → Respond **fully in Telugu script (తెలుగులో)**.  
        - English → Respond in **short, friendly English**.  
    2. **Keep It Friendly**"""},

    {"role": "user", "content": f"User Query: {user_input}"}
    ]

    response = client.chat.completions.create(  
    model="llama-3.3-70b-versatile",
    messages=greet_prompt
    )
    return response.choices[0].message.content.strip()

#sort_filter
def filter_sort(query):
    """Uses Groq API to generate chatbot response."""
    

    
    SCHEMA = """
    Table: products
    Columns:
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    product_name TEXT,
    quantity TEXT,
    stock_status TEXT,
    price TEXT,
    description TEXT,
    url TEXT UNIQUE"""

    print("sorting")
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "Generate an optimized SQLite query based on this schema:""{SCHEMA}"
                    "Return only the SQL query, without any explanation or formatting."
                    "Ensure the following:"

                    "1. Category Filtering:"
                    "   - If the user specifies a category, apply:"
                    "     \"WHERE category = 'specified_category'\""
                    "   - Handle category mapping:"
                    "     - 'fruits' → Fruits '(exact category name)'"
                    "     - 'spinach', 'spinach leaf varieties', 'keerai', 'keera' → Spinach Leaf Varieties'(exact category name)'"
                    "     - 'leafy veggies','spinach leaf' → Spinach Leaf Varieties'(exact category name)'"
                    "     - 'english vegetables', 'english veg' → English Vegetables'(exact category name)'"
                    "   - If the category is 'vegetables' (without specifying Traditional or English), do not apply a filter."

                    "2. Sorting by Price:"
                    "   - If sorting is requested (e.g., 'sort by price'), apply:"
                    "     \"ORDER BY CAST(REPLACE(price, '₹', '') AS REAL)\""
                    "   - If sorting for 'english vegetables' or 'english veg' from high to low, apply:"
                    "     \"ORDER BY CAST(REPLACE(price, '₹', '') AS REAL) DESC\""
                    "   - If sorting for 'spinach leaf varieties' or related keywords from low to high, apply:"
                    "     \"ORDER BY CAST(REPLACE(price, '₹', '') AS REAL) ASC\""
                    "   - If sorting for 'spinach leaf varieties' or related keywords from high to low, apply:"
                    "     \"ORDER BY CAST(REPLACE(price, '₹', '') AS REAL) DESC\""

                    "3. Filtering by Stock Status:"
                    "   - Ensure case-insensitive matching using:"
                    "     \"WHERE LOWER(stock_status) = 'in stock'\"  -- or 'out of stock'"

                    "4. Price Conditions Handling:"
                    "   - If the user specifies a price condition, apply:"
                    "     - 'price by X rupees' → "
                    "       \"WHERE CAST(REPLACE(price, '₹', '') AS REAL) = X\""
                    "     - 'price below X', 'price under X', 'less than X rupees' → "
                    "       \"WHERE CAST(REPLACE(price, '₹', '') AS REAL) < X\""
                    "     - 'price above X', 'more than X rupees', 'greater than X' → "
                    "       \"WHERE CAST(REPLACE(price, '₹', '') AS REAL) > X\""

                    "5. Ensure Numeric Price Conversion:"
                    "   - Always convert price values correctly using:"
                    "     \"CAST(TRIM(REPLACE(price, '₹', '')) AS REAL)\""

                    "6. Use the Correct Table Name:"
                    "   - Always use 'products' or another valid table name in the schema."
                    "   - If filtering by category, include both category and other conditions."

                    "7. Return a valid SQLite query only, without comments or explanations."

                ),
            },
            {"role": "user", "content": query}
        ],
        "temperature": 0.3  # Lower temperature for more deterministic responses
    }

    try:
        response = requests.post(ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()  # Raise error for bad responses
        data = response.json()

        full_response = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        match = re.search(r"sql\n(.*?)\n", full_response, re.DOTALL)

        return match.group(1).strip() if match else full_response  # If no match, assume raw response is SQL
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Failed: {e}")
    except (KeyError, IndexError):
        print("❌ Unexpected API response format.")
    return None



def execute_query(query):
    """Executes the generated SQL query and returns results."""
    if not query:
        print("⚠ No valid SQL query provided.")
        return None

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(query)
        results = cursor.fetchall()

        if not results:
            print("⚠ No matching records found in the database.")
            return None

        return results
    except sqlite3.Error as e:
        print(f"❌ SQLite Error: {e}")
    finally:
        conn.close()  # Ensures connection closes properly
    return None


def format_response(data, user_input):
    """Formats retrieved data into a natural language response using Groq API."""
    if not data:
        return "No relevant data found."

    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    if any(term in user_input.lower() for term in ["price", "cost", "cheapest", "low to high", "ascending"]):
        prompt = (f"Convert this structured data into a clear and precise natural language summary. "
                  f"Return a structured list format with 'Product Name - ₹Price'. "
                  f"Ensure the output is strictly sorted by price in ascending order:\n{data}")

    elif any(term in user_input.lower() for term in
             ["quantity", "stock", "amount", "lowest quantity", "smallest quantity"]):
        prompt = (f"Convert this structured data into a clear and precise natural language summary. "
                  f"Return a structured list format with 'Product Name - Quantity'. "
                  f"Ensure the output is strictly sorted by quantity in ascending order:\n{data}")

    else:
        return "Invalid request. Please specify 'sort by price' or 'sort by quantity'."

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system",
             "content": "Summarize the following SQL query results into a concise and meaningful sentence."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5
    }

    try:
        response = requests.post(ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Failed: {e}")
    return "Error in response formatting."



@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("query", "").strip().lower()
    
    if not user_input:
        return jsonify({"response": "I couldn't find relevant information. Can you rephrase?"})
    
    intent = detect_intent(user_input)

    
    if intent == "greeting":
        response = generate_greeting_response(user_input)
        return jsonify({"response": response})
    if intent == "sort_Fiter":
        sql_query = filter_sort(user_input)
        results = execute_query(sql_query)
        return jsonify({"response": format_response(results, user_input)})
  
    retrieved_text = retrieve_relevant_text(user_input)
    response = generate_response(retrieved_text, user_input)
    return jsonify({"response": response})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
