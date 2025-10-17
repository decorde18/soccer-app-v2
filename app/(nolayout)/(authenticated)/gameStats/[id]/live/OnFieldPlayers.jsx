"use client";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

function OnFieldPlayers() {
  const columns = [
    { key: "number", label: "#" },
    { key: "name", label: "Name", width: "25%" },
    { key: "shots", label: "Sh" },
    { key: "goals", label: "G" },
    { key: "assists", label: "A" },
    { key: "timeIn", label: "Time" },
    { key: "timeInRecent", label: "Last In" },
  ];

  const data = [
    {
      id: 1,
      number: 1,
      name: "John Doe",
      shots: 1,
      goals: 1,
      assists: 0,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 2,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 3,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 4,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 5,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 6,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 7,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 8,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 9,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
    {
      id: 10,
      number: 2,
      name: "Jane Smith",
      shots: 2,
      goals: 0,
      assists: 1,
      timeIn: "00:30",
      timeInRecent: "00:30",
    },
  ];
  const handleEdit = (row) => {
    console.log(row);
  };
  return (
    <>
      <div className='row-start-2   shadow-lg overflow-hidden'>
        {/* <div className='row-start-2 flex items-center justify-center  shadow-lg overflow-hidden'> */}
        <div className='text-2xl font-bold '>On Field Players</div>
        <Table
          columns={columns}
          data={data}
          size='sm'
          hoverable
          // caption='On Field Players'
          onRowClick={(row) => console.log("Clicked:", row)}
          actions={(row, index) => (
            <Button
              onClick={() => handleEdit(row)}
              className='px-3 py-0  text-white rounded hover:bg-blue-600'
            >
              Edit
            </Button>
          )}
          actionsLabel='Status'
          actionsWidth='100px'
        />
      </div>
    </>
  );
}

export default OnFieldPlayers;
