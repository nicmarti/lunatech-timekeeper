package fr.lunatech.timekeeper.services.dtos;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

public final class ProjectResponse {

    @NotNull
    private final Long id;
    @NotBlank
    private final String name;
    @NotNull
    private final Boolean billable;
    @NotNull
    private final String description;
    private final String clientName;
    @NotNull
    private final List<MemberResponse> members;
    @NotNull
    private final Boolean publicAccess;

    public ProjectResponse(@NotNull Long id, @NotBlank String name, @NotNull Boolean billable, @NotNull String description, @NotNull String clientName, @NotNull List<MemberResponse> members, @NotNull Boolean publicAccess) {
        this.id = id;
        this.name = name;
        this.billable = billable;
        this.description = description;
        this.clientName = clientName;
        this.members = members;
        this.publicAccess = publicAccess;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Boolean getBillable() {
        return billable;
    }

    public String getDescription() {
        return description;
    }

    public String getClientName() {
        return clientName;
    }

    public Boolean isPublicAccess() {
        return publicAccess;
    }

    public List<MemberResponse> getMembers() {
        return members;
    }
}
