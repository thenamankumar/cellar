const getValue = async payload => {
  const res = await fetch('http://127.0.0.1:5000/get/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const {value} = await res.json();

    return value;
  } else {
    return false;
  }
};

export default getValue;
