import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  getCustomers,
  editCustomer,
  deleteCustomer
} from "../../api/frenchise/customer";

const MySubscribers = () => {

  const { isDark } = useTheme();

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editModal, setEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailId: ""
  });

  useEffect(() => {
    fetchCustomers(page);
  }, [page]);

  const fetchCustomers = async (pageNumber) => {

    try {

      setLoading(true);

      const res = await getCustomers(pageNumber, 10);

      const formatted = res.data.map((c) => ({
        id: c._id,
        name: `${c.firstName} ${c.lastName}`,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phoneNumber,
        email: c.emailId,
        userId: c.userName,
        status: c.status === "ACTIVE" ? "Active" : "Inactive",
        plan: c.userType
      }));

      setSubscribers(formatted);
      setTotalPages(res.pagination.totalPages);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }

  };

  // ========================
  // OPEN EDIT MODAL
  // ========================

  const openEdit = (customer) => {

    setSelectedCustomer(customer);

    setEditForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phoneNumber: customer.phone,
      emailId: customer.email
    });

    setEditModal(true);

  };

  // ========================
  // UPDATE CUSTOMER
  // ========================

  const updateCustomer = async () => {

    try {

      await editCustomer(selectedCustomer.id, editForm);

      setSubscribers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                name: `${editForm.firstName} ${editForm.lastName}`,
                phone: editForm.phoneNumber,
                email: editForm.emailId
              }
            : c
        )
      );

      setEditModal(false);

    } catch (err) {
      console.error("Update error", err);
    }

  };

  // ========================
  // DELETE CUSTOMER
  // ========================

  const removeCustomer = async (id) => {

    if (!window.confirm("Delete this customer?")) return;

    try {

      await deleteCustomer(id);

      setSubscribers((prev) => prev.filter((c) => c.id !== id));

    } catch (err) {
      console.error("Delete error", err);
    }

  };

  return (

    <div className={`rounded-xl border flex flex-col ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>

      {/* HEADER */}

      <div className="p-6 border-b flex justify-between items-center">

        <div>

          <h2 className="text-xl font-bold">Franchise Subscribers</h2>
          <p className="text-sm text-gray-500">Manage your franchise customers</p>

        </div>

      </div>

      {/* TABLE */}

      <div className="p-4">

        {loading ? (

          <div className="animate-pulse space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>

        ) : (

          <table className="w-full text-left">

            <thead>

              <tr className="border-b text-xs uppercase text-gray-500">

                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right">Actions</th>

              </tr>

            </thead>

            <tbody>

              {subscribers.map((sub) => (

                <tr key={sub.id} className="border-b hover:bg-gray-50">

                  <td className="py-4 px-4">

                    <div className="flex flex-col">

                      <span className="font-semibold">{sub.name}</span>
                      <span className="text-xs text-gray-500">{sub.userId}</span>

                    </div>

                  </td>

                  <td className="py-4 px-4">{sub.plan}</td>

                  <td className="py-4 px-4">

                    <span className={`text-xs px-2 py-1 rounded ${
                      sub.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {sub.status}
                    </span>

                  </td>

                  <td className="py-4 px-4">{sub.phone}</td>

                  <td className="py-4 px-4">{sub.email}</td>

                  <td className="py-4 px-4 text-right flex gap-3 justify-end">

                    <button
                      onClick={() => openEdit(sub)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => removeCustomer(sub.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* PAGINATION */}

      <div className="flex justify-between p-4 border-t">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded"
        >
          Previous
        </button>

        <span>Page {page} / {totalPages}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded"
        >
          Next
        </button>

      </div>

      {/* EDIT MODAL */}

      {editModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-lg w-96">

            <h3 className="text-lg font-bold mb-4">Edit Customer</h3>

            <input
              className="border p-2 w-full mb-2"
              placeholder="First Name"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({ ...editForm, firstName: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Last Name"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Phone"
              value={editForm.phoneNumber}
              onChange={(e) =>
                setEditForm({ ...editForm, phoneNumber: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-4"
              placeholder="Email"
              value={editForm.emailId}
              onChange={(e) =>
                setEditForm({ ...editForm, emailId: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateCustomer}
                className="px-4 py-2 bg-orange-600 text-white rounded"
              >
                Update
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default MySubscribers;