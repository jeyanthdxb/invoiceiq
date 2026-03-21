import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";

const defaultItems = [{ description: "", quantity: 1, price: "", loading: false }];

export default function App() {
  const [user, setUser] = useState(null);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const FREE_LIMIT = 3;

  const [business, setBusiness] = useState({ name: "", email: "", phone: "" });
  const [client, setClient] = useState({ name: "", email: "" });
  const [items, setItems] = useState(defaultItems);
  const [invoiceNo] = useState("INV-" + Math.floor(Math.random() * 9000 + 1000));
  const [date] = useState(new Date().toLocaleDateString("en-IN"));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, price: "", loading: false }]);

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const removeItem = (index) =>
    setItems(items.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity), 0
  );

  const handleGeneratePDF = async () => {
    if (invoiceCount >= FREE_LIMIT) {
      alert("🔒 Free limit reached! Upgrade to Pro for unlimited invoices.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNo, date, business, client, items, total }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNo}.pdf`;
      a.click();

      setInvoiceCount(invoiceCount + 1);
    } catch (error) {
      alert("Error generating PDF. Make sure the backend is running!");
    }
  };

  const enhanceDescription = async (index) => {
    const item = items[index];
    if (!item.description.trim()) {
      alert("Please enter a description first!");
      return;
    }

    const updated = [...items];
    updated[index].loading = true;
    setItems(updated);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      if (!apiKey) {
        alert("API key not found! Check your .env file.");
        const updatedItems = [...items];
        updatedItems[index].loading = false;
        setItems(updatedItems);
        return;
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 100,
          messages: [
            {
              role: "system",
              content: "You are a professional invoice writer. Rewrite descriptions to sound professional and clear. Return ONLY the rewritten description, nothing else. Keep it under 10 words."
            },
            {
              role: "user",
              content: `Rewrite this invoice description professionally: "${item.description}"`
            }
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Groq Error: ${data.error.message}`);
        const updatedItems = [...items];
        updatedItems[index].loading = false;
        setItems(updatedItems);
        return;
      }

      const enhanced = data.choices[0].message.content.trim();
      const updatedItems = [...items];
      updatedItems[index].description = enhanced;
      updatedItems[index].loading = false;
      setItems(updatedItems);

    } catch (error) {
      alert(`Error: ${error.message}`);
      const updatedItems = [...items];
      updatedItems[index].loading = false;
      setItems(updatedItems);
    }
  };

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Top bar */}
      <div className="flex justify-between items-center max-w-6xl mx-auto mb-4 bg-white rounded-xl px-5 py-3 shadow text-sm">
        <span className="text-gray-500">👤 {user.email}</span>
        <span className="text-gray-500">
          Invoices:{" "}
          <span className={invoiceCount >= FREE_LIMIT ? "text-red-500 font-bold" : "text-indigo-600 font-bold"}>
            {invoiceCount}/{FREE_LIMIT}
          </span>{" "}
          free
        </span>
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-600 font-medium"
        >
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold text-indigo-600 mb-6 text-center">🧾 InvoiceIQ</h1>

      <div className="flex gap-6 max-w-6xl mx-auto">

        {/* LEFT — Form */}
        <div className="w-1/2 bg-white rounded-2xl shadow p-6 space-y-6">

          {/* Business Info */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Your Business</h2>
            {["name", "email", "phone"].map((field) => (
              <input
                key={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={business[field]}
                onChange={(e) => setBusiness({ ...business, [field]: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            ))}
          </section>

          {/* Client Info */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Client Details</h2>
            {["name", "email"].map((field) => (
              <input
                key={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={client[field]}
                onChange={(e) => setClient({ ...client, [field]: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            ))}
          </section>

          {/* Line Items */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Items / Services</h2>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <div className="flex-1 flex gap-1">
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={() => enhanceDescription(index)}
                    disabled={item.loading}
                    title="Enhance with AI"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    {item.loading ? "..." : "✨"}
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  className="w-14 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  placeholder="₹"
                  value={item.price}
                  onChange={(e) => updateItem(index, "price", e.target.value)}
                  className="w-24 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold"
                >×</button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="text-indigo-500 text-sm font-medium hover:underline mt-1"
            >+ Add Item</button>
          </section>

          {/* Generate Button */}
          <button
            onClick={handleGeneratePDF}
            disabled={invoiceCount >= FREE_LIMIT}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {invoiceCount >= FREE_LIMIT ? "🔒 Upgrade to Generate More" : "Generate PDF →"}
          </button>

        </div>

        {/* RIGHT — Live Preview */}
        <div className="w-1/2 bg-white rounded-2xl shadow p-8 font-sans text-sm text-gray-800">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-indigo-600">
                {business.name || "Your Business Name"}
              </h2>
              <p className="text-gray-500">{business.email || "email@example.com"}</p>
              <p className="text-gray-500">{business.phone || "+91 XXXXX XXXXX"}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-700">INVOICE</p>
              <p className="text-gray-400">{invoiceNo}</p>
              <p className="text-gray-400">{date}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Bill To</p>
            <p className="font-semibold">{client.name || "Client Name"}</p>
            <p className="text-gray-500">{client.email || "client@email.com"}</p>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b text-gray-400 text-xs uppercase">
                <th className="text-left pb-2">Description</th>
                <th className="text-center pb-2">Qty</th>
                <th className="text-right pb-2">Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-2">{item.description || "—"}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{Number(item.price).toLocaleString("en-IN")}</td>
                  <td className="py-2 text-right font-medium">
                    ₹{(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-between items-center bg-indigo-50 rounded-xl px-4 py-3">
            <span className="font-semibold text-gray-600">Total Amount</span>
            <span className="text-xl font-bold text-indigo-600">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-300 text-xs mt-8">
            Thank you for your business 🙏
          </p>

        </div>
      </div>
    </div>
  );
}