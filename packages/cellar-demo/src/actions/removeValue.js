const removeValue = async payload => {
  const res = await fetch('http://127.0.0.1:5000/remove/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const value = await res.json();

    return value;
  } else {
    return false;
  }
};

export default removeValue;
