const { default: ClubsTable } = require("./ClubsTable");

function page() {
  return (
    <div>
      <h1>Clubs</h1>
      <ClubsTable />
    </div>
  );
}

export default page;
