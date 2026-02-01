import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Pencil, Save, Trash2, Palette } from "lucide-react";
import { useTheme, colorThemeNames } from "@/components/theme-provider";

type ColorTheme = "michelin-star" | "forest-bistro" | "vaporwave" | "high-end-bar";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { colorTheme, setColorTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (user) {
      setProfileName(user.profileName || user.firstName || "");
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { profileName?: string; firstName?: string; lastName?: string }) => {
      const response = await apiRequest("PATCH", "/api/auth/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your personal information has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/user");
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/api/logout";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const trimmedProfileName = profileName.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    updateProfileMutation.mutate({
      profileName: trimmedProfileName || undefined,
      firstName: trimmedFirstName || undefined,
      lastName: trimmedLastName || undefined,
    });
  };

  const handleEdit = () => {
    setProfileName(user?.profileName || user?.firstName || "");
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfileName(user?.profileName || user?.firstName || "");
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setIsEditing(false);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8 text-primary" />
        <h1 className="font-serif text-3xl font-medium">My Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Username</Label>
              <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="text-username">
                {user?.username || user?.id || "Not set"}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="text-email">
                {user?.email || "Not set"}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profileName">Display Name</Label>
              {isEditing ? (
                <Input
                  id="profileName"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter display name"
                  data-testid="input-profile-name"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="text-profile-name">
                  {user?.profileName || user?.firstName || "Not set"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                This is the name shown on your public profile and recipes
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  data-testid="input-first-name"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="text-first-name">
                  {user?.firstName || "Not set"}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Surname</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter surname"
                  data-testid="input-last-name"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="text-last-name">
                  {user?.lastName || "Not set"}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground">Member since</Label>
              <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="text-member-since">
                {formatDate(user?.createdAt)}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Theme
              </Label>
              <Select 
                value={colorTheme} 
                onValueChange={(value) => setColorTheme(value as ColorTheme)}
              >
                <SelectTrigger data-testid="select-theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(colorThemeNames).map(([value, label]) => (
                    <SelectItem key={value} value={value} data-testid={`theme-option-${value}`}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changes apply immediately to the app and exported recipe books
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleEdit} data-testid="button-edit-profile">
                <Pencil className="w-4 h-4 mr-2" />
                Update Personal Information
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-destructive/20">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. All your recipes and data will be permanently removed.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-delete-account">
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your recipes, images, and account data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAccountMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                  disabled={deleteAccountMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteAccountMutation.isPending ? "Deleting..." : "Permanently Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
