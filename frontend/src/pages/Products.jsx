import React, { useState, useEffect, useMemo } from "react";
import MasterLayout from "../components/Layout";
import "../App.css";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../services/productService";

function Products({ user, onLogout, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    unit: "Box",
    unitPrice: "",
    quantity: ""
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    unit: "",
    unitPrice: "",
    quantity: ""
  });

  const [deleteProductId, setDeleteProductId] = useState(null);
  const [notification, setNotification] = useState(null);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const fetchProductList = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data || []);
      setLoading(false);
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to load products: " + (err.message || "Unknown error")
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductList();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesName =
        !searchName ||
        p.name.toLowerCase().includes(searchName.trim().toLowerCase());
      const stock = Number(p.quantity || 0);
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "in-stock" && stock > 0) ||
        (statusFilter === "out-of-stock" && stock === 0);
      return matchesName && matchesStatus;
    });
  }, [products, searchName, statusFilter]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.unit || newProduct.unitPrice === "") {
      setNotification({
        type: "error",
        message: "Please fill in all required fields"
      });
      return;
    }

    const price = parseFloat(newProduct.unitPrice);
    const qty = parseInt(newProduct.quantity || "0", 10);

    if (isNaN(price) || price < 0) {
      setNotification({
        type: "error",
        message: "Unit price must be a valid number >= 0"
      });
      return;
    }
    if (isNaN(qty) || qty < 0) {
      setNotification({
        type: "error",
        message: "Quantity must be a valid number >= 0"
      });
      return;
    }

    try {
      const created = await createProduct({
        name: newProduct.name.trim(),
        unit: newProduct.unit.trim(),
        unitPrice: price,
        quantity: qty
      });
      setProducts([created, ...products]);
      setShowAddModal(false);
      setNewProduct({ name: "", unit: "Box", unitPrice: "", quantity: "" });
      setNotification({
        type: "success",
        message: `Product "${created.name}" created successfully!`
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to create product: " + err.message
      });
    }
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setEditFormData({
      name: p.name,
      unit: p.unit,
      unitPrice: p.unitPrice.toString(),
      quantity: (p.quantity ?? 0).toString()
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const price = parseFloat(editFormData.unitPrice);
    const qty = parseInt(editFormData.quantity || "0", 10);

    if (isNaN(price) || price < 0) {
      setNotification({
        type: "error",
        message: "Unit price must be a valid number >= 0"
      });
      return;
    }
    if (isNaN(qty) || qty < 0) {
      setNotification({
        type: "error",
        message: "Quantity must be a valid number >= 0"
      });
      return;
    }

    try {
      const updated = await updateProduct(editingProduct._id, {
        name: editFormData.name.trim(),
        unit: editFormData.unit.trim(),
        unitPrice: price,
        quantity: qty
      });
      setProducts(products.map((p) => (p._id === updated._id ? updated : p)));
      setEditingProduct(null);
      setNotification({
        type: "success",
        message: `Product "${updated.name}" updated successfully!`
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update product: " + err.message
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteProductId) return;
    try {
      await deleteProduct(deleteProductId);
      setProducts(products.filter((p) => p._id !== deleteProductId));
      setDeleteProductId(null);
      setNotification({
        type: "success",
        message: "Product deleted successfully!"
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to delete product: " + err.message
      });
    }
  };

  return (
    <MasterLayout
      currentPage="products"
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      <div className="page-header">
        <h1>Product Management</h1>
        <p>
          {isAdmin
            ? "Manage product inventory, pricing, units, and stock levels."
            : "View available products, pricing, and current stock levels."}
        </p>
      </div>

      {notification && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor:
              notification.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: notification.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${
              notification.type === "success" ? "#a7f3d0" : "#fecaca"
            }`,
            fontWeight: "500"
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Filter Bar */}
      <section className="debt-filters agency-filters" style={{ marginBottom: "20px" }}>
        <div className="debt-filters-header">
          <h3>Filters & Search</h3>
        </div>
        <div className="agency-filter-row">
          <div className="agency-search-wrapper" style={{ flex: 2 }}>
            <input
              type="text"
              placeholder="Search product by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <svg
              className="agency-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="#94a3b8"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="All">All Stock Status</option>
            <option value="in-stock">In Stock (&gt; 0)</option>
            <option value="out-of-stock">Out of Stock (0)</option>
          </select>
        </div>
      </section>

      {/* Main Table Card */}
      <div className="regulation-card">
        <div className="regulation-card-header">
          <div>
            <h3 className="regulation-section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginRight: "8px", verticalAlign: "middle" }}
              >
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
              </svg>
              Product Inventory ({filteredProducts.length})
            </h3>
            <p className="regulation-section-subtitle">
              {isAdmin
                ? "Manage product catalog, pricing, and stock inventory levels."
                : "Product catalog and available warehouse quantities."}
            </p>
          </div>

          {isAdmin && (
            <button
              className="regulation-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span>Add New Product</span>
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading products...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="regulation-table-container">
            <table className="regulation-table">
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>No.</th>
                  <th>Product Name</th>
                  <th>Unit Type</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: "right" }}>In Stock</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  {isAdmin && (
                    <th className="regulation-table-actions-header">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => {
                  const qty = Number(product.quantity || 0);
                  const isOutOfStock = qty <= 0;
                  return (
                    <tr key={product._id}>
                      <td style={{ textAlign: "center", color: "#64748b" }}>
                        {idx + 1}
                      </td>
                      <td>
                        <span className="regulation-table-text" style={{ fontWeight: 600 }}>
                          {product.name}
                        </span>
                      </td>
                      <td>
                        <span className="regulation-table-text">
                          {product.unit}
                        </span>
                      </td>
                      <td>
                        <span className="regulation-table-text">
                          ${Number(product.unitPrice).toLocaleString()}.00
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isOutOfStock ? "#ef4444" : "#0f172a",
                            fontSize: "15px"
                          }}
                        >
                          {qty.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: isOutOfStock ? "#fee2e2" : "#dcfce7",
                            color: isOutOfStock ? "#991b1b" : "#166534"
                          }}
                        >
                          {isOutOfStock ? "Out of Stock" : "In Stock"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="regulation-table-actions">
                          <button
                            className="regulation-action-btn regulation-action-edit"
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              width="16"
                              height="16"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.69 1.003l-2.657.615c-.961.222-1.777-.595-1.556-1.555l.615-2.657c.18-.78.527-1.487 1.003-1.69L16.862 4.487z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 7.125L16.862 4.487"
                              />
                            </svg>
                          </button>
                          <button
                            className="regulation-action-btn regulation-action-delete"
                            onClick={() => setDeleteProductId(product._id)}
                            title="Delete Product"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              width="16"
                              height="16"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="regulation-empty-state">
            No products found matching your search.
          </div>
        )}
      </div>

      {/* Modal: Add New Product (Admin Only) */}
      {showAddModal && isAdmin && (
        <div
          className="regulation-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="regulation-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="regulation-modal-header">
              <h3>Add New Product</h3>
              <button
                className="regulation-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="regulation-modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="input-group">
                    <label>
                      Product Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      placeholder="e.g. Coca Cola Lon 330ml"
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="input-group">
                      <label>
                        Unit Type <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={newProduct.unit}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, unit: e.target.value })
                        }
                        placeholder="e.g. Box, Bottle, Can"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>
                        Unit Price ($) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        value={newProduct.unitPrice}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, unitPrice: e.target.value })
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>
                      Initial Stock Quantity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, quantity: e.target.value })
                      }
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="regulation-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: "6px" }}
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product (Admin Only) */}
      {editingProduct && isAdmin && (
        <div
          className="regulation-modal-overlay"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="regulation-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="regulation-modal-header">
              <h3>Edit Product</h3>
              <button
                className="regulation-modal-close"
                onClick={() => setEditingProduct(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="regulation-modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="input-group">
                    <label>
                      Product Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="input-group">
                      <label>
                        Unit Type <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.unit}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, unit: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>
                        Unit Price ($) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        value={editFormData.unitPrice}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            unitPrice: e.target.value
                          })
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>
                      Current Stock Quantity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      value={editFormData.quantity}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          quantity: e.target.value
                        })
                      }
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="regulation-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: "6px" }}
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation (Admin Only) */}
      {deleteProductId && isAdmin && (() => {
        const prod = products.find((p) => p._id === deleteProductId);
        return (
          <div
            className="regulation-modal-overlay"
            onClick={() => setDeleteProductId(null)}
          >
            <div
              className="regulation-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="regulation-confirm-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3>Delete Product</h3>
              <p>
                Are you sure you want to delete <strong>"{prod?.name}"</strong>?
                This action cannot be undone.
              </p>
              <div className="regulation-confirm-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteProductId(null)}
                >
                  Cancel
                </button>
                <button className="btn-danger" onClick={confirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </MasterLayout>
  );
}

export default Products;
