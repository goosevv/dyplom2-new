// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Spinner,
  useToast,
} from "@chakra-ui/react";

export default function AdminPage() {
  const [users, setUsers] = useState(null);
  const toast = useToast();

  useEffect(() => {
    axios
      .get("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setUsers(res.data))
      .catch(() =>
        toast({ status: "error", title: "Не вдалося завантажити користувачів" })
      );
  }, []);

  if (users === null) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  const handleChangeRole = (id, role) => {
    axios
      .patch(
        `/api/users/${id}/role`,
        { role },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      )
      .then(() => {
        setUsers((us) =>
          us.map((u) => (u.id === id ? { ...u, role } : u))
        );
        toast({ status: "success", title: "Роль успішно змінено" });
      })
      .catch(() =>
        toast({ status: "error", title: "Помилка зміни ролі" })
      );
  };

  return (
    <Box p={6}>
      <Heading mb={4}>Панель адміністратора</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Ім’я</Th>
            <Th>Email</Th>
            <Th>Роль</Th>
            <Th>Змінити роль</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((u) => (
            <Tr key={u.id}>
              <Td>{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              <Td>
                <Select
                  value={u.role}
                  onChange={(e) => handleChangeRole(u.id, e.target.value)}
                  size="sm"
                >
                  <option value="user">user</option>
                  <option value="content_manager">content_manager</option>
                  <option value="admin">admin</option>
                </Select>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
