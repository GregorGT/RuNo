import { useAtom } from "jotai/react";
import {
  Modal,
  Menu,
  Input,
  Select,
  Button,
  Form,
  notification,
  Space,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState, useEffect } from "react";
import { FileOutlined, FolderOpenOutlined } from "@ant-design/icons";
import "./Database.scss";
import {
  connectionsStore,
  connectionsAtom,
  Connection,
} from "../../state/connection";

const { Text } = Typography;

const connectionTypes = ["Oracle", "MySQL", "PostgreSQL", "SQLite"] as const;

// Default ports for each database type
const defaultPorts: Record<string, number> = {
  Oracle: 1521,
  MySQL: 3306,
  PostgreSQL: 5432,
  SQLite: 0, // SQLite doesn't require a port
};

// Jotai atoms for state management
export default function ConnectionManagerDialog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useAtom(connectionsAtom);
  const { connections, selectedConnectionId } = state;
  const selectedConnection = connections.find(
    (c) => c.id === selectedConnectionId
  );

  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [buttonState, setButtonState] = useState<
    "default" | "testing" | "connected" | "failed"
  >("default");

  const connectionType = Form.useWatch("type", form);
  useEffect(() => {
    if (selectedConnection) {
      form.setFieldsValue({
        ...selectedConnection,
        port: selectedConnection.port || defaultPorts[selectedConnection.type],
      });
    } else {
      form.resetFields();
    }
  }, [selectedConnection, form]);
  useEffect(() => {
    if (connectionType && defaultPorts[connectionType] !== undefined) {
      form.setFieldsValue({
        port: defaultPorts[connectionType],
      });
      // Also update the connection in store if one is selected
      if (selectedConnectionId) {
        connectionsStore.getState().updateConnection(selectedConnectionId, {
          port: defaultPorts[connectionType],
        });
      }
    }
  }, [connectionType, form, selectedConnectionId]);
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    connectionsStore.getState().setSelectedConnectionId(e.key);
    setButtonState("default");
  };

  const handleAddConnection = () => {
    const newConnection: Connection = {
      id: Date.now().toString(),
      name: "New Connection",
      type: "MySQL",
      url: "",
      database: "",
      user: "",
      password: "",
    };
    connectionsStore.getState().addConnection(newConnection);
    connectionsStore.getState().setSelectedConnectionId(newConnection.id);
    form.setFieldsValue(newConnection);
  };

  const handleTestConnection = async () => {
    setButtonState("testing"); // Change button state to 'testing'
    try {
      const values = await form.validateFields();
      const payload =
        values.type === "SQLite"
          ? {
              name: values.name,
              type: values.type,
              url: values.url,
            }
          : {
              ...values,
              port: values.port ? Number(values.port) : undefined,
              database: values.database ? String(values.database) : undefined,
            };
      console.log("payload:", payload);
      const success = await invoke("test_connection", { config: payload });
      console.log("success-->", success);
      if (success) {
        setButtonState("connected"); // Change button state to 'connected'
        if (selectedConnectionId) {
          connectionsStore.getState().updateConnection(selectedConnectionId, {
            lastTested: new Date().toISOString(),
          });
        }
        api.success({
          message: "Connection successful!",
          placement: "topRight",
        });
      } else {
        setButtonState("failed"); // Change button state to 'failed'
        api.error({ message: "Connection failed!", placement: "topRight" });
      }
    } catch (error) {
      console.error("Connection error:", error);
      setButtonState("failed"); // Change button state to 'failed'
      api.error({
        message: "Connection error." + error,
        placement: "topRight",
      });
    }
  };
  const handleValuesChange = (changedValues: Partial<Connection>) => {
    console.log("changed Value----<>", changedValues);
    if (!selectedConnectionId) return;
    connectionsStore
      .getState()
      .updateConnection(selectedConnectionId, changedValues);
  };
  const handleDeleteConnection = () => {
    if (selectedConnectionId) {
      connectionsStore.getState().deleteConnection(selectedConnectionId);
      form.resetFields(); // Reset form to clear all fields
      setButtonState("default"); // Reset button state
    }
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "SQLite Database",
            extensions: ["db", "sqlite", "sqlite3", "db3"],
          },
          { name: "All Files", extensions: ["*"] },
        ],
        title: "Select SQLite Database File",
      });

      if (selected && typeof selected === "string") {
        form.setFieldsValue({ url: selected });
        // Also update the connection in store if one is selected
        if (selectedConnectionId) {
          connectionsStore.getState().updateConnection(selectedConnectionId, {
            url: selected,
          });
        }
        api.success({
          message: "File selected successfully",
          description: selected,
          placement: "topRight",
        });
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      api.error({
        message: "Failed to select file",
        description: error instanceof Error ? error.message : String(error),
        placement: "topRight",
      });
    }
  };
  const formatFilePath = (path: string) => {
    if (!path) return null;
    const parts = path.split(/[\\/]/);
    if (parts.length <= 2) return path;
    return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  };

  const filePath = Form.useWatch("url", form);
  return (
    <Modal
      title="SQL Connection Manager"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {contextHolder}
      <div className="connection-manager">
        <div className="left-panel">
          <div className="connection-list">
            <Menu
              mode="inline"
              selectedKeys={selectedConnection ? [selectedConnection.id] : []}
              onClick={handleMenuClick}
              items={connections.map((c) => ({
                key: c.id,
                label: c.name,
              }))}
            />
          </div>
          <Button
            type="primary"
            onClick={handleAddConnection}
            className="add-button"
          >
            Add Connection
          </Button>
        </div>

        <div className="right-panel">
          <Form
            form={form}
            layout="horizontal"
            onValuesChange={handleValuesChange}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true }]}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true }]}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Select
                options={connectionTypes.map((t) => ({ value: t, label: t }))}
              />
            </Form.Item>

            {connectionType === "SQLite" ? (
              <Form.Item
                label="File"
                name="url"
                rules={[
                  {
                    required: true,
                    message: "Please select a database file",
                  },
                ]}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Click browse to select a database file"
                    readOnly
                    value={form.getFieldValue("url")}
                    prefix={<FileOutlined />}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#fafafa",
                    }}
                    onClick={handleFileSelect}
                    className="file-path-input"
                  />
                </Space.Compact>
                <div className="file-hint">
                  Select an SQLite database file (.db, .sqlite, .sqlite3, .db3)
                </div>
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  label="URL"
                  name="url"
                  rules={[{ required: true }]}
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Port"
                  name="port"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Input type="number" />
                </Form.Item>
                <Form.Item
                  label="Database"
                  name="database"
                  // rules={[{ required: true }]}
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="User"
                  name="user"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Password"
                  name="password"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Input.Password visibilityToggle={false} />
                </Form.Item>
              </>
            )}

            <div className="button-group">
              <Button
                type="primary"
                onClick={handleTestConnection}
                style={{ marginRight: 8 }}
                loading={buttonState === "testing"}
              >
                {buttonState === "testing"
                  ? "Testing..."
                  : buttonState === "connected"
                  ? "Test Connection"
                  : "Test Connection"}
              </Button>
              <Button
                danger
                onClick={handleDeleteConnection}
                disabled={!selectedConnection}
              >
                Delete
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
}
