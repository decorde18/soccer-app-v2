"use client";

import { useApiData } from "@/hooks/useApiData";

import { useEffect, useState } from "react";
import { clubsFields } from "@/lib/pageColumns";
import Button from "@/components/ui/Button";

import Modal from "@/components/ui/Modal";
import Form from "@/components/ui/Form";

import { Edit2 } from "lucide-react";
import ClubsTable from "@/app/(public)/clubs/ClubsTable";

function ClubsMain() {
  const {
    loading,
    error,
    data: fetchedData,
    create,
    update,
  } = useApiData("clubs");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [formData, setFormData] = useState({});
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    setClubs(fetchedData || []);
  }, [fetchedData]);

  const handleSubmit = async (data) => {
    try {
      if (editingClub) {
        await update(editingClub.id, data);
      } else {
        await create(data);
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingClub(null);
    } catch (err) {
      console.error("Failed to save club:", err);
    }
  };
  const handleEdit = (club) => {
    setEditingClub(club);
    setFormData(club);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    setEditingClub(null);
    setFormData({ type: "high_school", is_active: true });
    setIsModalOpen(true);
  };
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };
  if (loading) return <div>Loading clubs...</div>;
  if (error) return <div>Error loading clubs</div>;

  return (
    <>
      <div className='flex items-center justify-between flex-row-reverse p-3'>
        <Button onClick={handleAdd} className='w-40 '>
          Add Club
        </Button>
      </div>
      <ClubsTable
        clubs={clubs}
        actions={(row) => (
          <Button
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            variant='outline'
          >
            <Edit2 size={14} className='mr-2' />
            Edit
          </Button>
        )}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClub ? "Edit Club" : "Add Club"}
      >
        <Form
          fields={clubsFields}
          data={formData}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isEditing={!!editingClub}
          loading={loading}
        />
      </Modal>
    </>
  );
}

export default ClubsMain;
