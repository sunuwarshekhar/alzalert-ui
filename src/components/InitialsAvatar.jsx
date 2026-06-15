const InitialsAvatar = ({ name, photoUrl, size = 40 }) => {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
