'use client'; // needed in all error.js

function Error({
  error,
  name = 'An error occurred!',
  message = 'There is an unkown error',
}) {
  console.log(error);
  return (
    <div className="error">
      <h1>{name}</h1>
      <p>{message}</p>
    </div>
  );
}

export default Error;
