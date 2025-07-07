import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  Paper,
  TextInput,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Button,
  Stack,
} from '@mantine/core';
import {
  IconSearch,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
  IconDownload,
  IconFilter,
} from '@tabler/icons-react';
import { useState } from 'react';

const ModernTable = ({
  data = [],
  columns = [],
  title,
  searchable = true,
  filterable = true,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredData = data.filter(item =>
    searchTerm === '' || Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0;
    
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 },
    },
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        p={{ base: 'md', sm: 'xl' }}
        radius="lg"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="modern-table-container"
      >
        {/* Header */}
        <Stack gap={{ base: 'sm', sm: 'md' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap={{ base: 'xs', sm: 'sm' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Text size={{ base: 'lg', sm: 'xl' }} fw={700} className="modern-table-title">
                {title}
              </Text>
            </motion.div>
            
            <Group gap="sm" wrap="wrap">
              {searchable && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <TextInput
                    placeholder="Search..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ minWidth: '200px', width: '100%' }}
                    className="modern-table-search"
                  />
                </motion.div>
              )}
              
              {filterable && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <ActionIcon
                    size="lg"
                    variant="subtle"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <IconFilter size={16} />
                  </ActionIcon>
                </motion.div>
              )}
            </Group>
          </Group>

          {/* Table */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Table.ScrollContainer minWidth={800}>
              <Table
                striped
                highlightOnHover
                verticalSpacing="md"
                style={{
                  '--table-border-color': 'rgba(255,255,255,0.1)',
                  backgroundColor: 'transparent',
                }}
              >
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {columns.map((column, index) => (
                      <motion.th
                        key={column.key}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        style={{
                          cursor: column.sortable ? 'pointer' : 'default',
                          padding: '16px',
                          fontWeight: 600,
                          color: 'white',
                          borderBottom: '2px solid rgba(255,255,255,0.1)',
                        }}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <Group gap="xs">
                          <Text fw={600}>{column.title}</Text>
                          {column.sortable && sortBy === column.key && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring' }}
                            >
                              <Text size="xs">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Text>
                            </motion.div>
                          )}
                        </Group>
                      </motion.th>
                    ))}
                    <Table.Th style={{ width: 60 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  <AnimatePresence>
                    {sortedData.map((row, index) => (
                      <motion.tr
                        key={row.id || index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                          cursor: onRowClick ? 'pointer' : 'default',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                        whileHover={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          scale: 1.01,
                          transition: { duration: 0.2 },
                        }}
                        onClick={() => onRowClick && onRowClick(row)}
                      >
                        {columns.map((column) => (
                          <Table.Td
                            key={column.key}
                            style={{ padding: '16px', color: 'white' }}
                          >
                            {column.render 
                              ? column.render(row[column.key], row)
                              : row[column.key]
                            }
                          </Table.Td>
                        ))}
                        
                        <Table.Td>
                          <Menu
                            shadow="lg"
                            position="bottom-end"
                            styles={{
                              dropdown: {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                              },
                            }}
                          >
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                style={{ color: 'white' }}
                              >
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            
                            <Menu.Dropdown>
                              {onView && (
                                <Menu.Item
                                  leftSection={<IconEye size={14} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onView(row);
                                  }}
                                  style={{ color: 'white' }}
                                >
                                  View
                                </Menu.Item>
                              )}
                              
                              {onEdit && (
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(row);
                                  }}
                                  style={{ color: 'white' }}
                                >
                                  Edit
                                </Menu.Item>
                              )}
                              
                              <Menu.Item
                                leftSection={<IconDownload size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                style={{ color: 'white' }}
                              >
                                Download
                              </Menu.Item>
                              
                              {onDelete && (
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(row);
                                  }}
                                >
                                  Delete
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </motion.div>

          {sortedData.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Stack align="center" py="xl">
                <Text c="dimmed" ta="center">
                  {searchTerm ? 'No results found' : 'No data available'}
                </Text>
              </Stack>
            </motion.div>
          )}
        </Stack>
      </Paper>
      <style>{`
        @media (max-width: 600px) {
          .modern-table-container { padding: 12px !important; }
          .modern-table-title { font-size: 1.1rem !important; }
          .modern-table-search { min-width: 150px !important; font-size: 14px !important; }
          .mantine-Table-root { font-size: 11px !important; }
          .mantine-Table-th, .mantine-Table-td { padding: 4px 6px !important; }
          .mantine-ActionIcon-root { width: 28px !important; height: 28px !important; }
          .mantine-Button-root { padding: 6px 10px !important; font-size: 12px !important; }
        }
        @media (max-width: 768px) {
          .modern-table-container { padding: 16px !important; }
          .modern-table-title { font-size: 1.3rem !important; }
          .modern-table-search { min-width: 180px !important; }
          .mantine-Table-th, .mantine-Table-td { padding: 6px 8px !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default ModernTable;