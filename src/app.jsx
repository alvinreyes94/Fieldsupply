import React, { useEffect, useState } from "react";

const STORAGE_KEY = "fieldsupply-demo-v1";

const initialData = {
  users: [
    { id: "u1", name: "Demo Foreman", role: "foreman", active: true },
    { id: "u2", name: "Cameron", role: "manager", active: true },
    { id: "u3", name: "Office Staff", role: "office", active: true },
    { id: "u4", name: "Delivery Driver", role: "driver", active: true }
  ],
  jobs: ["Brightview", "Beacon", "Hudson"],
  requests: []
};

const makeId = () =>
  crypto.randomUUID?.() || String(Date.now() + Math.random());

const blankItem = () => ({
  id: makeId(),
  quantity: 1,
  material: "",
  delivered: 0
});

const canManage = (role) =>
  role === "office" || role === "manager";

const canViewAll = (role) =>
  canManage(role) || role === "driver";

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialData;
  } catch {
    return initialData;
  }
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [userId, setUserId] = useState("u1");
  const [page, setPage] = useState("dashboard");
  const [job, setJob] = useState("Brightview");
  const [type, setType] = useState("material");
  const [items, setItems] = useState([blankItem()]);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState(null);
  const [newJob, setNewJob] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const user = data.users.find(u => u.id === userId);
  const role = user?.role || "foreman";
  const manager = canManage(role);
  const driver = role === "driver";

  const updateRequest = (id, change) => {
    if (driver) return;
    setData(prev => ({
      ...prev,
      requests: prev.requests.map(r =>
        r.id === id ? { ...r, ...change } : r
      )
    }));
  };

  const createRequest = () => {
    const clean = items
      .filter(i => i.material.trim() && Number(i.quantity) > 0)
      .map(i => ({
        ...i,
        quantity: Number(i.quantity),
        delivered: 0
      }));

    if (!clean.length) {
      alert("Please enter at least one item.");
      return;
    }

    const request = {
      id: makeId(),
      job,
      type,
      items: clean,
      notes,
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString(),
      status: "Pending",
      seenBy: []
    };

    setData(prev => ({
      ...prev,
      requests: [request, ...prev.requests]
    }));

    setItems([blankItem()]);
    setNotes("");
    setPage("dashboard");
    alert("Request submitted!");
  };

  const visibleRequests = data.requests.filter(r =>
    canViewAll(role) || r.createdById === userId
  );

  const outstanding = visibleRequests.filter(r =>
    r.items.some(i => i.delivered < i.quantity)
  );

  const openRequest = (request) => {
    setSelected(request.id);

    if (canViewAll(role) && request.createdById !== userId) {
      setData(prev => ({
        ...prev,
        requests: prev.requests.map(r => {
          if (r.id !== request.id) return r;
          if (r.seenBy.some(s => s.userId === userId)) return r;

          return {
            ...r,
            seenBy: [
              ...r.seenBy,
              {
                userId,
                name: user.name,
                time: new Date().toISOString()
              }
            ]
          };
        })
      }));
    }

    setPage("details");
  };

  const request = data.requests.find(r => r.id === selected);

  const changeDelivered = (itemId, value) => {
    if (!request || driver) return;

    const updatedItems = request.items.map(i => {
      if (i.id !== itemId) return i;
      return {
        ...i,
        delivered: Math.max(
          0,
          Math.min(i.quantity, Number(value) || 0)
        )
      };
    });

    const complete = updatedItems.every(
      i => i.delivered >= i.quantity
    );

    updateRequest(request.id, {
      items: updatedItems,
      status: complete
        ? "Delivered"
        : updatedItems.some(i => i.delivered > 0)
        ? "Partially Delivered"
        : request.status === "Delivered"
        ? "Pending"
        : request.status
    });
  };

  const printRequest = (r) => {
    const escapeHTML = (s) =>
      String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]);

    const rows = r.items.map(i => `
      <tr>
        <td>${escapeHTML(i.material)}</td>
        <td>${i.quantity}</td>
        <td>${Math.max(0, i.quantity - i.delivered)}</td>
      </tr>
    `).join("");

    const html = `
      <html>
      <head>
        <title>FieldSupply Request</title>
        <style>
          body { font-family: Arial; padding: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #aaa; padding: 10px; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <h1>FieldSupply</h1>
        <h2>${escapeHTML(r.type)} Request</h2>
        <p>Jobsite: ${escapeHTML(r.job)}</p>
        <p>Requested by: ${escapeHTML(r.createdBy)}</p>
        <p>Date: ${new Date(r.createdAt).toLocaleString()}</p>
        <table>
          <tr>
            <th>Item</th><th>Requested</th><th>Still Needed</th>
          </tr>
          ${rows}
        </table>
        <p>Notes: ${escapeHTML(r.notes)}</p>
      </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Allow pop-ups to print this request.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f1f5f9",
      color: "#172033",
      fontFamily: "Arial, sans-serif"
    },
    header: {
      background: "#10243a",
      color: "white",
      padding: 20
    },
    card: {
      background: "white",
      padding: 18,
      borderRadius: 12,
      marginBottom: 14,
      boxShadow: "0 2px 8px #00000010"
    },
    button: {
      background: "#1675d1",
      color: "white",
      border: 0,
      padding: "12px 16px",
      borderRadius: 8,
      cursor: "pointer",
      margin: 4
    },
    input: {
      padding: 11,
      border: "1px solid #ccd3dd",
      borderRadius: 7,
      width: "100%",
      boxSizing: "border-box",
      marginBottom: 10
    }
  };

  const Button = ({ children, onClick, disabled, color }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        ...styles.button,
        background: color || "#1675d1",
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>FieldSupply</h1>
        <p>Materials & Tools Request System</p>

        <label>Demo account</label>
        <select
          style={styles.input}
          value={userId}
          onChange={e => {
            setUserId(e.target.value);
            setPage("dashboard");
          }}
        >
          {data.users.filter(u => u.active).map(u => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>
      </header>

      <main style={{ maxWidth: 850, margin: "auto", padding: 16 }}>
        <nav style={{ marginBottom: 20 }}>
          <Button onClick={() => setPage("dashboard")}>
            Dashboard
          </Button>
          {!driver && (
            <Button onClick={() => setPage("new")}>
              New Request
            </Button>
          )}
          {manager && (
            <Button onClick={() => setPage("admin")}>
              Administration
            </Button>
          )}
        </nav>

        {page === "dashboard" && (
          <>
            <h2>Welcome, {user.name}</h2>

            <div style={styles.card}>
              <h3>Request Overview</h3>
              <p>Total requests: {visibleRequests.length}</p>
              <p>Requests with outstanding items: {outstanding.length}</p>
              <p>
                Fully delivered:{" "}
                {visibleRequests.filter(r =>
                  r.items.every(i => i.delivered >= i.quantity)
                ).length}
              </p>
            </div>

            <h2>Material & Tool Requests</h2>

            {!visibleRequests.length && (
              <div style={styles.card}>No requests submitted yet.</div>
            )}

            {visibleRequests.map(r => (
              <div key={r.id} style={styles.card}>
                <h3>{r.job}</h3>
                <p>
                  <strong>{r.type.toUpperCase()}</strong> — {r.status}
                </p>
                <p>Requested by: {r.createdBy}</p>
                <p>{new Date(r.createdAt).toLocaleString()}</p>
                <p>
                  Outstanding items:{" "}
                  {r.items.filter(i => i.delivered < i.quantity).length}
                </p>
                <Button onClick={() => openRequest(r)}>
                  View Request
                </Button>
              </div>
            ))}
          </>
        )}

        {page === "new" && !driver && (
          <div style={styles.card}>
            <h2>Create New Request</h2>

            <label>Jobsite</label>
            <select
              style={styles.input}
              value={job}
              onChange={e => setJob(e.target.value)}
            >
              {data.jobs.map(j => (
                <option key={j}>{j}</option>
              ))}
            </select>

            <label>Request Type</label>
            <select
              style={styles.input}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="material">Materials</option>
              <option value="tool">Tools</option>
            </select>

            <h3>Items Needed</h3>

            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 45px",
                  gap: 8,
                  marginBottom: 8
                }}
              >
                <input
                  type="number"
                  min="1"
                  aria-label="Quantity"
                  style={styles.input}
                  value={item.quantity}
                  onChange={e => setItems(prev =>
                    prev.map((i, n) =>
                      n === index
                        ? { ...i, quantity: e.target.value }
                        : i
                    )
                  )}
                />
                <input
                  placeholder={
                    type === "tool"
                      ? "Tool description"
                      : "Material description / size"
                  }
                  style={styles.input}
                  value={item.material}
                  onChange={e => setItems(prev =>
                    prev.map((i, n) =>
                      n === index
                        ? { ...i, material: e.target.value }
                        : i
                    )
                  )}
                />
                <button
                  onClick={() => setItems(prev =>
                    prev.length > 1
                      ? prev.filter(i => i.id !== item.id)
                      : prev
                  )}
                >
                  X
                </button>
              </div>
            ))}

            <Button onClick={() =>
              setItems(prev => [...prev, blankItem()])
            }>
              + Add Another Item
            </Button>

            <h3>Additional Notes</h3>
            <textarea
              style={styles.input}
              rows="4"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Special instructions..."
            />

            <Button onClick={createRequest} color="#16834a">
              Submit Request
            </Button>
          </div>
        )}

        {page === "details" && request && (
          <div style={styles.card}>
            <Button onClick={() => setPage("dashboard")}>
              Back
            </Button>

            <h2>{request.job}</h2>
            <p>Type: {request.type}</p>
            <p>Requested by: {request.createdBy}</p>
            <p>Status: {request.status}</p>

            {manager && (
              <>
                <label>Order Status</label>
                <select
                  style={styles.input}
                  value={request.status}
                  onChange={e =>
                    updateRequest(request.id, {
                      status: e.target.value
                    })
                  }
                >
                  <option>Pending</option>
                  <option>Ordered</option>
                  <option>Partially Delivered</option>
                  <option>Delivered</option>
                </select>
              </>
            )}

            <h3>Requested Items</h3>

            {request.items.map(i => (
              <div
                key={i.id}
                style={{
                  padding: 12,
                  borderBottom: "1px solid #ddd"
                }}
              >
                <strong>{i.material}</strong>
                <p>Requested: {i.quantity}</p>
                <p>Delivered: {i.delivered}</p>
                <p>
                  Still needed: {Math.max(0, i.quantity - i.delivered)}
                </p>

                {!driver && (manager ||
                  request.createdById === userId) && (
                  <>
                    <label>Quantity delivered</label>
                    <input
                      type="number"
                      min="0"
                      max={i.quantity}
                      style={styles.input}
                      value={i.delivered}
                      onChange={e =>
                        changeDelivered(i.id, e.target.value)
                      }
                    />
                  </>
                )}
              </div>
            ))}

            <h3>Notes</h3>
            <p>{request.notes || "No notes."}</p>

            <h3>Read Receipts</h3>
            {request.seenBy.length ? (
              request.seenBy.map(s => (
                <p key={s.userId}>
                  Seen by {s.name} —{" "}
                  {new Date(s.time).toLocaleString()}
                </p>
              ))
            ) : (
              <p>Not yet viewed by office, manager or driver.</p>
            )}

            <Button onClick={() => printRequest(request)}>
              Print / Save as PDF
            </Button>
          </div>
        )}

        {page === "admin" && manager && (
          <>
            <div style={styles.card}>
              <h2>Employee Access</h2>
              <p>
                Demo only: account switching is not secure authentication.
              </p>

              {data.users.map(u => (
                <div key={u.id} style={{
                  padding: 10,
                  borderBottom: "1px solid #ddd"
                }}>
                  <strong>{u.name}</strong> — {u.role}
                  <p>{u.active ? "Active" : "Disabled"}</p>
                  <Button
                    disabled={u.id === userId}
                    onClick={() => setData(prev => ({
                      ...prev,
                      users: prev.users.map(x =>
                        x.id === u.id
                          ? { ...x, active: !x.active }
                          : x
                      )
                    }))}
                  >
                    {u.active ? "Disable Access" : "Enable Access"}
                  </Button>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <h2>Jobsites</h2>
              {data.jobs.map(j => <p key={j}>{j}</p>)}

              <input
                style={styles.input}
                placeholder="New jobsite name"
                value={newJob}
                onChange={e => setNewJob(e.target.value)}
              />

              <Button onClick={() => {
                const name = newJob.trim();
                if (!name || data.jobs.includes(name)) return;
                setData(prev => ({
                  ...prev,
                  jobs: [...prev.jobs, name]
                }));
                setNewJob("");
              }}>
                Add Jobsite
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
