const killNode = async payload => {
  const res = await fetch('http://127.0.0.1:5000/kill/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const {success} = await res.json();

    return success;
  } else {
    return false;
  }
};

export default killNode;
