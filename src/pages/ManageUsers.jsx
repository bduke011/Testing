
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Shield, UserCheck, UserX, Mail, Trash2, Settings, Pencil, Save, X, Search } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    checkAdmin();
    loadUsers();
  }, []);

  const checkAdmin = async () => {
    const userData = await User.me();
    setCurrentUser(userData);
    if (userData?.role !== "admin") {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadUsers = async () => {
    const usersList = await User.list();
    setUsers(usersList);
    setLoading(false);
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const userData = await User.get(userId);
      await User.update(userId, {
        ...userData,
        role: newRole
      });
      await loadUsers(); // Reload the users list to show the update
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await User.delete(userId);
      loadUsers(); // Reload the users list after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) return;

    setShowInviteDialog(false);
    setInviteEmail("");
    loadUsers();
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!editingUser) return;
      
      const userData = await User.get(editingUser.id);
      
      await User.update(editingUser.id, {
        ...userData,
        full_name: editingUser.full_name,
        role: editingUser.role
      });
      
      setEditingUser(null);
      await loadUsers(); // Reload to show changes
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500">Manage user access and roles</p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {user.full_name || (
                      <span className="text-[#1B2841]/40 italic">Name not set</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Joined {format(new Date(user.created_date), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {user.role === "admin" ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <UserCheck className="w-3 h-3" />
                    )}
                    {user.role}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {currentUser.id !== user.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="flex items-center gap-2 border-gray-300 hover:bg-gray-100"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const newRole = user.role === "admin" ? "user" : "admin";
                            await handleRoleUpdate(user.id, newRole);
                          }}
                          className="border-gray-300 hover:bg-gray-100 flex items-center gap-2"
                        >
                          {user.role === "admin" ? (
                            <>
                              <UserX className="w-4 h-4" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Make Admin
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">Try adjusting your search</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUserUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.full_name || ""}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    full_name: e.target.value
                  })}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    role: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
