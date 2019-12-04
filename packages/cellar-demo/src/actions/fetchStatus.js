const fetchStatus = async () => {
  const res = await fetch('http://127.0.0.1:5000/status/');

  if (res.ok) {
    const {status} = await res.json();
    return status;
  } else {
    return [];
  }
};

export default fetchStatus;
