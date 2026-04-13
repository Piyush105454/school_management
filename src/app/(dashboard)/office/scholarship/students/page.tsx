import StudentsClient from "./StudentsClient";

export default async function StudentsPage() {
  const classesList = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  return <StudentsClient classesList={classesList} />;
}
